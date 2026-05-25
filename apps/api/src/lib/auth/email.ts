import { Resend } from 'resend';
import { env, isMockEmail } from '../../config/env';
import { logger } from '../logger';

const resend = isMockEmail ? null : new Resend(env.RESEND_API_KEY);

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: SendArgs): Promise<void> {
  if (!resend) {
    logger.info({ to, subject, html }, '[MOCK EMAIL] (RESEND_API_KEY non configurée)');
    return;
  }
  await resend.emails.send({ from: env.RESEND_FROM, to, subject, html });
}

export async function sendMagicLinkEmail(to: string, url: string): Promise<void> {
  const html = `
    <h2>Connexion à AI Compta</h2>
    <p>Cliquez sur le lien ci-dessous pour vous connecter (valide 15 minutes) :</p>
    <p><a href="${url}">Se connecter à AI Compta</a></p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
  `;
  await sendEmail({ to, subject: 'Votre lien de connexion AI Compta', html });
}

export async function sendInvitationEmail(to: string, url: string, orgName: string): Promise<void> {
  const html = `
    <h2>Invitation à rejoindre ${orgName} sur AI Compta</h2>
    <p>Vous avez été invité à rejoindre l'espace comptable de ${orgName}.</p>
    <p><a href="${url}">Accepter l'invitation</a></p>
  `;
  await sendEmail({ to, subject: `Invitation — ${orgName}`, html });
}
