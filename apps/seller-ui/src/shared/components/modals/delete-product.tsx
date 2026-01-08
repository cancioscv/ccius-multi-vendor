import { X } from "lucide-react";

interface Props {
  product: any;
  onClose: () => void;
  onConfirm: () => void;
  onRestore: () => void;
}
export default function DeleteProductModal({ product, onClose, onConfirm, onRestore }: Props) {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg md:w-[450px] shadow-lg">
        <div className="flex justify-between items-center border-b border-gray-700 pb-3">
          <h3 className="text-xl text-white">Delete Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={22} />
          </button>
        </div>

        <p className="text-gray-300 mt-4">
          Are you sure you want do delete {""} <span className="font-semibold text-white">{product.title}</span>? <br />
          This product will be moved to a **deletee state** and permanently removed *after 24 hours*. You can recover it within this time.
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md text-white transition">
            Cancel
          </button>
          <button
            onClick={!product?.isDeleted ? onConfirm : onRestore}
            className={`${
              product?.isDeleted ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
            } rounded-md text-white font-semibold transition px-4 py-2`}
          >
            {product?.isDeleted ? "Restore" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
