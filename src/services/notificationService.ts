import { LocalNotifications } from '@capacitor/local-notifications';

export const notificationService = {
    /**
     * Solicita permissões para notificações locais.
     */
    requestPermissions: async () => {
        const status = await LocalNotifications.requestPermissions();
        return status.display === 'granted';
    },

    /**
     * Agenda uma notificação de inatividade para 48 horas no futuro.
     * Cancela qualquer notificação anterior de mesmo ID antes de agendar.
     */
    scheduleInactivityNotification: async (title: string, body: string) => {
        try {
            // ID fixo para a notificação de retenção para que ela seja sobrescrita/resetada
            const NOTIFICATION_ID = 2026;

            // Cancela agendamentos anteriores
             await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }] });

            // Agenda para 48 horas a partir de agora
            const scheduleDate = new Date();
            scheduleDate.setHours(scheduleDate.getHours() + 48);

            await LocalNotifications.schedule({
                notifications: [
                    {
                        title,
                        body,
                        id: NOTIFICATION_ID,
                        schedule: { at: scheduleDate },
                        sound: 'default',
                        actionTypeId: '',
                        extra: null
                    }
                ]
            });

            console.log('[NotificationService] Inactivity notification scheduled for:', scheduleDate);
        } catch (error) {
            console.error('[NotificationService] Error scheduling notification:', error);
        }
    }
};
