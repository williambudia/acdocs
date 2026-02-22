import type { User, Document, Notification } from "./types";
import { getDaysUntilExpiration } from "./types";

// Mock notification service - simula envio de notificações
export class NotificationService {
  private static notifications: Notification[] = [];

  // Solicitar permissão para notificações do navegador
  static async requestBrowserPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.log("Este navegador não suporta notificações");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  }

  // Enviar notificação do navegador (REAL)
  static async sendBrowserNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    if (Notification.permission !== "granted") {
      return false;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: "/icon-192.png", // Você pode adicionar um ícone depois
        badge: "/icon-192.png",
        tag: data?.documentId || "notification",
        requireInteraction: true,
        data,
      });

      notification.onclick = () => {
        window.focus();
        if (data?.url) {
          window.location.href = data.url;
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
      return false;
    }
  }

  // Enviar email (MOCK - apenas simula)
  static async sendEmail(
    user: User,
    document: Document,
    daysLeft: number
  ): Promise<Notification> {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      userId: user.id,
      documentId: document.id,
      documentName: document.name,
      type: "email",
      status: "sent",
      message: `Email enviado para ${user.email}: Documento "${document.name}" vence em ${daysLeft} dias`,
      sentAt: new Date().toISOString(),
      expiresAt: document.expiresAt,
      daysUntilExpiration: daysLeft,
    };

    this.notifications.push(notification);
    console.log("📧 [MOCK EMAIL]", notification.message);
    
    return notification;
  }

  // Enviar WhatsApp (MOCK - apenas simula)
  static async sendWhatsApp(
    user: User,
    document: Document,
    daysLeft: number
  ): Promise<Notification> {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random()}`,
      userId: user.id,
      documentId: document.id,
      documentName: document.name,
      type: "whatsapp",
      status: "sent",
      message: `WhatsApp enviado para ${user.phone || "número não cadastrado"}: Documento "${document.name}" vence em ${daysLeft} dias`,
      sentAt: new Date().toISOString(),
      expiresAt: document.expiresAt,
      daysUntilExpiration: daysLeft,
    };

    this.notifications.push(notification);
    console.log("📱 [MOCK WHATSAPP]", notification.message);
    
    return notification;
  }

  // Verificar documentos expirando e enviar notificações
  static async checkExpiringDocuments(
    user: User,
    documents: Document[]
  ): Promise<Notification[]> {
    const sentNotifications: Notification[] = [];
    const prefs = user.notificationPreferences;

    if (!prefs) return sentNotifications;

    for (const doc of documents) {
      if (!doc.expiresAt) continue;

      const daysLeft = getDaysUntilExpiration(doc.expiresAt);
      if (daysLeft === null || daysLeft < 0) continue;

      // Verificar se deve alertar neste dia
      const shouldAlert = prefs.alertDaysBefore.includes(daysLeft);
      if (!shouldAlert) continue;

      // Enviar notificações conforme preferências
      if (prefs.email) {
        const notification = await this.sendEmail(user, doc, daysLeft);
        sentNotifications.push(notification);
      }

      if (prefs.whatsapp && user.phone) {
        const notification = await this.sendWhatsApp(user, doc, daysLeft);
        sentNotifications.push(notification);
      }

      if (prefs.browser) {
        const title = daysLeft === 0 
          ? "⚠️ Documento vence hoje!"
          : `⚠️ Documento vence em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`;
        
        const body = `${doc.name} - Expira em ${new Date(doc.expiresAt).toLocaleDateString()}`;
        
        await this.sendBrowserNotification(title, body, {
          documentId: doc.id,
          url: "/documents",
        });

        const notification: Notification = {
          id: `notif-${Date.now()}-${Math.random()}`,
          userId: user.id,
          documentId: doc.id,
          documentName: doc.name,
          type: "browser",
          status: "sent",
          message: `Notificação do navegador: ${title}`,
          sentAt: new Date().toISOString(),
          expiresAt: doc.expiresAt,
          daysUntilExpiration: daysLeft,
        };

        this.notifications.push(notification);
        sentNotifications.push(notification);
      }
    }

    return sentNotifications;
  }

  // Obter histórico de notificações
  static getNotifications(userId?: string): Notification[] {
    if (userId) {
      return this.notifications.filter((n) => n.userId === userId);
    }
    return this.notifications;
  }

  // Limpar histórico
  static clearNotifications(): void {
    this.notifications = [];
  }

  // Testar notificação (para demonstração)
  static async testNotification(user: User, type: "email" | "whatsapp" | "browser"): Promise<Notification | null> {
    const mockDoc: Document = {
      id: "test-doc",
      name: "Documento de Teste",
      fileName: "teste.pdf",
      fileSize: 100000,
      mimeType: "application/pdf",
      categoryId: "test-cat",
      documentTypeId: "test-type",
      uploadedById: user.id,
      currentVersion: 1,
      versions: [],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    switch (type) {
      case "email":
        return await this.sendEmail(user, mockDoc, 7);
      case "whatsapp":
        return await this.sendWhatsApp(user, mockDoc, 7);
      case "browser":
        await this.sendBrowserNotification(
          "🔔 Notificação de Teste",
          "Esta é uma notificação de teste do ACDocs",
          { documentId: "test", url: "/documents" }
        );
        return {
          id: `notif-${Date.now()}`,
          userId: user.id,
          documentId: "test-doc",
          documentName: "Documento de Teste",
          type: "browser",
          status: "sent",
          message: "Notificação de teste enviada",
          sentAt: new Date().toISOString(),
        };
      default:
        return null;
    }
  }
}
