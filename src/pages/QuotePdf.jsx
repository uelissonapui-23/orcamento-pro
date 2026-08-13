import { ArrowLeft, Download, Printer, Share2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import QuoteDocumentPreview from "../components/quotes/QuoteDocumentPreview";
import { useAuth } from "../contexts/AuthContext";
import { buildBusinessSnapshot } from "../lib/quotePdf";
import { createLogoPreviewUrl, loadBusinessSettings } from "../services/businessSettingsService";
import { downloadQuotePdf, shareQuotePdf } from "../services/pdfDocumentService";
import { getQuote } from "../services/quoteService";

export default function QuotePdf() {
  const { workspace } = useAuth();
  const { quoteId } = useParams();
  const [quote, setQuote] = useState(null);
  const [business, setBusiness] = useState({});
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!workspace?.id || !quoteId) return;
    setLoading(true);
    setError("");

    try {
      const loadedQuote = await getQuote(workspace.id, quoteId);
      const currentSettings = await loadBusinessSettings(workspace.id);
      const snapshot =
        loadedQuote.business_snapshot_json &&
        Object.keys(loadedQuote.business_snapshot_json).length
          ? loadedQuote.business_snapshot_json
          : buildBusinessSnapshot(currentSettings);

      setQuote(loadedQuote);
      setBusiness(snapshot);

      const pdfLogoPath = snapshot.pdf_logo_path || snapshot.logo_path;
      if (pdfLogoPath) {
        try {
          setLogoUrl(await createLogoPreviewUrl(pdfLogoPath));
        } catch {
          setLogoUrl("");
        }
      } else {
        setLogoUrl("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar o PDF.");
    } finally {
      setLoading(false);
    }
  }, [workspace?.id, quoteId]);

  useEffect(() => { load(); }, [load]);

  const run = async (type) => {
    if (!quote) return;
    setBusy(type);
    setError("");

    try {
      if (type === "download") {
        await downloadQuotePdf({ quote, business, logoUrl });
      } else if (type === "share") {
        await shareQuotePdf({ quote, business, logoUrl });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível gerar o PDF.");
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return <div className="pdf-page-loading"><div className="spinner" /><strong>Preparando documento...</strong></div>;
  }

  if (!quote) {
    return <div className="form-alert error">{error || "Orçamento não encontrado."}</div>;
  }

  return (
    <section className="quote-pdf-page">
      <div className="pdf-toolbar">
        <div>
          <Link to={`/orcamentos/${quote.id}`}><ArrowLeft size={16} /> Voltar ao orçamento</Link>
          <h1>Prévia do PDF</h1>
          <p>O arquivo baixado usa o mesmo conteúdo e identidade desta prévia.</p>
        </div>

        <div className="pdf-toolbar-actions">
          <button className="secondary-button" type="button" onClick={() => window.print()}>
            <Printer size={17} /> Imprimir
          </button>
          <button className="secondary-button" type="button" disabled={Boolean(busy)} onClick={() => run("share")}>
            <Share2 size={17} /> Compartilhar
          </button>
          <button className="primary-button" type="button" disabled={Boolean(busy)} onClick={() => run("download")}>
            <Download size={17} /> {busy === "download" ? "Gerando..." : "Baixar PDF"}
          </button>
        </div>
      </div>

      {error ? <div className="form-alert error pdf-page-error">{error}</div> : null}

      <div className="pdf-preview-stage">
        <QuoteDocumentPreview quote={quote} business={business} logoUrl={logoUrl} />
      </div>
    </section>
  );
}
