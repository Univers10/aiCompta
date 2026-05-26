import { prisma } from '../db/prisma';
import { minioClient, BUCKET_NAME } from '../storage/minio';
import { extractInvoiceData } from '../ai/invoice-extractor';
import { generateJournalEntries } from '../accounting/journal-generator';
import { env } from '../../config/env';

/**
 * Traite une facture : extraction IA + génération d'écritures comptables
 */
export async function processInvoice(documentId: string): Promise<void> {
  console.log(`[Invoice Processor] Starting processing for document ${documentId}`);

  try {
    // 1. Récupérer le document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { organization: true },
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    // Mettre à jour le statut en PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    // 2. Télécharger le fichier depuis MinIO
    console.log(`[Invoice Processor] Downloading file from MinIO: ${document.fileUrl}`);
    const stream = await minioClient.getObject(BUCKET_NAME, document.fileUrl);
    
    // Convertir le stream en buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // 3. Extraire les données avec Claude
    console.log(`[Invoice Processor] Extracting invoice data with Claude...`);
    const invoiceData = await extractInvoiceData(fileBuffer, document.mimeType);
    console.log(`[Invoice Processor] Extraction complete (confidence: ${invoiceData.confidence})`);

    // 4. Enregistrer la tentative d'extraction
    await prisma.extractionAttempt.create({
      data: {
        documentId: document.id,
        organizationId: document.organizationId,
        model: env.ANTHROPIC_MODEL,
        confidence: invoiceData.confidence.toString(),
        success: true,
        rawResponse: invoiceData as unknown as object,
      },
    });

    // 5. Mettre à jour le document avec les données extraites
    await prisma.document.update({
      where: { id: documentId },
      data: {
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate) : null,
        totalHT: invoiceData.totalHT?.toString() ?? null,
        totalTVA: invoiceData.totalTVA?.toString() ?? null,
        totalTTC: invoiceData.totalTTC?.toString() ?? null,
        currency: invoiceData.currency,
        confidence: invoiceData.confidence.toString(),
        extractedData: invoiceData as unknown as object,
      },
    });

    // 6. Créer ou récupérer le fournisseur
    let supplierId: string | null = null;
    if (invoiceData.supplierName) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: {
          organizationId: document.organizationId,
          name: invoiceData.supplierName,
        },
      });

      const supplier = existingSupplier
        ? await prisma.supplier.update({
            where: { id: existingSupplier.id },
            data: { taxId: invoiceData.supplierTaxId || undefined },
          })
        : await prisma.supplier.create({
            data: {
              organizationId: document.organizationId,
              name: invoiceData.supplierName,
              taxId: invoiceData.supplierTaxId,
            },
          });
      
      supplierId = supplier.id;
    }

    // Mettre à jour le document avec le fournisseur
    if (supplierId) {
      await prisma.document.update({
        where: { id: documentId },
        data: { supplierId },
      });
    }

    // 7. Déterminer le statut selon le score de confiance
    const confidenceThreshold = env.AI_CONFIDENCE_THRESHOLD;
    const needsReview = invoiceData.confidence < confidenceThreshold;

    if (needsReview) {
      // Score faible : Human-in-the-Loop requis
      console.log(`[Invoice Processor] Low confidence (${invoiceData.confidence}), marking as NEEDS_REVIEW`);
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'NEEDS_REVIEW' },
      });
    } else {
      // Score élevé : Générer automatiquement les écritures
      console.log(`[Invoice Processor] High confidence (${invoiceData.confidence}), generating journal entries...`);

      // Récupérer l'exercice fiscal actif
      const fiscalYear = await prisma.fiscalYear.findFirst({
        where: {
          organizationId: document.organizationId,
          isClosed: false,
        },
        orderBy: { startDate: 'desc' },
      });

      if (!fiscalYear) {
        throw new Error('No active fiscal year found');
      }

      // Récupérer le premier utilisateur de l'organisation comme créateur
      const membership = await prisma.membership.findFirst({
        where: { organizationId: document.organizationId },
        orderBy: { createdAt: 'asc' },
      });

      if (!membership) {
        throw new Error('No user found in organization');
      }

      // Générer les écritures comptables
      const journalEntry = await generateJournalEntries({
        organizationId: document.organizationId,
        fiscalYearId: fiscalYear.id,
        documentId: document.id,
        invoiceData,
        createdById: membership.userId,
      });

      console.log(`[Invoice Processor] Journal entry created: ${journalEntry.id}`);

      // Marquer le document comme VALIDATED
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'VALIDATED' },
      });
    }

    console.log(`[Invoice Processor] ✅ Document processed successfully`);
  } catch (error) {
    console.error(`[Invoice Processor] ❌ Error processing document ${documentId}:`, error);

    // Récupérer l'organizationId du document
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { organizationId: true },
    });

    if (doc) {
      // Enregistrer l'échec
      await prisma.extractionAttempt.create({
        data: {
          documentId,
          organizationId: doc.organizationId,
          model: env.ANTHROPIC_MODEL,
          confidence: '0',
          success: false,
          rawResponse: {},
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }

    // Marquer le document comme REJECTED
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'REJECTED',
        rejectedReason: error instanceof Error ? error.message : 'Erreur lors du traitement',
      },
    });

    throw error;
  }
}
