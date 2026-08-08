import { X } from "lucide-react";
import WrappingWizard from "./WrappingWizard";

export default function WrappingWizardDialog({ open, workspaceId, product, onClose, onComplete }) {
  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}><div className="wrapping-dialog" role="dialog" aria-modal="true" aria-label="Wizard de envelopamento"><div className="dialog-header"><div><strong>Wizard de envelopamento</strong><span>Escolha. O app calcula o restante.</span></div><button type="button" onClick={onClose} aria-label="Fechar"><X size={20} /></button></div><WrappingWizard workspaceId={workspaceId} product={product} onCancel={onClose} onComplete={onComplete} /></div></div>;
}
