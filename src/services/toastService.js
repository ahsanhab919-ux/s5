import { toast } from "react-toastify";

class ToastService {
  /**
   * Show upload success notification
   */
  uploadSuccess(fileName, onViewHistory) {
    toast.success(
      <div>
        <div className="font-semibold">{fileName}</div>
        <div className="text-sm">File processed successfully!</div>
      </div>,
      {
        onClick: onViewHistory,
        autoClose: 5000,
      },
    );
  }

  /**
   * Show upload error notification
   */
  uploadError(fileName, errorMessage) {
    toast.error(
      <div>
        <div className="font-semibold">{fileName}</div>
        <div className="text-sm">{errorMessage}</div>
      </div>,
      {
        autoClose: 7000,
      },
    );
  }

  /**
   * Show batch completion notification
   */
  batchComplete(count, onViewHistory) {
    toast.success(
      <div>
        <div className="font-semibold">All files processed!</div>
        <div className="text-sm">{count} files ready to download</div>
      </div>,
      {
        onClick: onViewHistory,
        autoClose: 10000,
        closeOnClick: false,
      },
    );
  }

  /**
   * Show validation error
   */
  validationError(message) {
    toast.warning(message, {
      autoClose: 5000,
    });
  }

  /**
   * Show info message
   */
  info(message) {
    toast.info(message, {
      autoClose: 4000,
    });
  }
}

export const toastService = new ToastService();
