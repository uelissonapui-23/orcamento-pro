import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { useRef } from "react";

export default function LogoUploader({ logoUrl, busy, onUpload, onRemove }) {
  const inputRef = useRef(null);

  const chooseFile = () => inputRef.current?.click();

  return (
    <div className="logo-uploader">
      <div className="logo-preview-box">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo da empresa" />
        ) : (
          <div className="logo-empty">
            <ImagePlus size={26} />
            <span>Sem logo</span>
          </div>
        )}
      </div>

      <div className="logo-actions">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
            event.target.value = "";
          }}
        />

        <button className="secondary-button" disabled={busy} type="button" onClick={chooseFile}>
          <UploadCloud size={17} />
          {logoUrl ? "Trocar logo" : "Enviar logo"}
        </button>

        {logoUrl ? (
          <button className="text-danger-button" disabled={busy} type="button" onClick={onRemove}>
            <Trash2 size={16} />
            Remover
          </button>
        ) : null}

        <small>PNG, JPG ou WebP. Máximo de 2 MB.</small>
      </div>
    </div>
  );
}
