import { toastController, alertController } from "@ionic/vue";

export function useNotification() {
  /**
   * Show a toast message
   * @param {string} message - The message to display
   * @param {'success' | 'danger' | 'warning' | 'primary'} color - The color theme
   * @param {number} duration - Duration in ms
   */
  const showToast = async (message, color = "danger", duration = 3000) => {
    const toast = await toastController.create({
      message,
      color,
      duration,
      position: "bottom",
      cssClass: "app-toast",
      buttons: [
        {
          text: "Dismiss",
          role: "cancel",
        },
      ],
    });
    await toast.present();
  };

  /**
   * Show an alert dialog
   * @param {string} header - Title of the alert
   * @param {string} message - Content of the alert
   */
  const showAlert = async (header, message) => {
    const alert = await alertController.create({
      header,
      message,
      buttons: ["OK"],
    });
    await alert.present();
  };

  return {
    showToast,
    showAlert,
  };
}
