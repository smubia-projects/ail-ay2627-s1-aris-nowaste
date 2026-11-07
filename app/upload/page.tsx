import { ReceiptUpload } from "@/components/ReceiptUpload";

// AI Lodge showcase: the receipt is read by the API (Cloud Run) and the groceries go into the pantry in this
// browser. The original Supabase + Telegram-linked version is in original-supabase/upload-page.tsx.
export default function UploadPage() {
  return <main className="mx-auto max-w-5xl px-5 py-12"><p className="eyebrow">Receipt upload</p><h1 className="mt-3 text-5xl font-black tracking-tight">Add groceries from a receipt.</h1><p className="mt-4 max-w-2xl text-[#526259]">Your photo is sent to an AI model to read the products, then discarded: nothing is stored on our server. Review the extracted products before adding them to your pantry, which is saved in this browser only.</p><ReceiptUpload/></main>;
}
