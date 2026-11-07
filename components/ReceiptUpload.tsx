"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { ReceiptExtraction } from "@/schemas/receipt";
import { writeDemoScenario } from "@/lib/demoScenario";
import { addReceipt } from "@/lib/localPantry";
import { api, LimitError } from "@/lib/api";

type Result = { purchaseDate: string; extraction: ReceiptExtraction };

/** The photo as a JPEG data URL, at most 1600 px on the long side (smaller upload, still readable). */
async function toDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.88);
}

// AI Lodge showcase: the receipt goes to the API for AI extraction (the guest demo used canned results), and the
// confirmed groceries are added to the pantry in this browser (lib/localPantry.ts) instead of Supabase.
export function ReceiptUpload() {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [result, setResult] = useState<Result|null>(null); const [done, setDone] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false); const [stream, setStream] = useState<MediaStream|null>(null); const [selectedFile, setSelectedFile] = useState<File|null>(null); const [capturedFile, setCapturedFile] = useState<File|null>(null); const [capturedPreview, setCapturedPreview] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null); const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(()=>{if(stream&&videoRef.current){videoRef.current.srcObject=stream;void videoRef.current.play()}return()=>{stream?.getTracks().forEach((track)=>track.stop())}},[stream]);
  async function openCamera() {
    setError(""); setSelectedFile(null); setCapturedFile(null); setCapturedPreview("");
    if (!navigator.mediaDevices?.getUserMedia) { setError("This browser does not support camera capture. Choose an image instead."); return; }
    try { const nextStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});setCameraOpen(true);setStream(nextStream); }
    catch { setError("Camera access was not available. Allow camera permission or choose an image instead."); }
  }
  function closeCamera() { stream?.getTracks().forEach((track)=>track.stop());setStream(null);setCameraOpen(false); }
  function capturePhoto() {
    const video=videoRef.current;const canvas=canvasRef.current;if(!video||!canvas)return;
    canvas.width=video.videoWidth;canvas.height=video.videoHeight;canvas.getContext("2d")?.drawImage(video,0,0);
    canvas.toBlob((blob)=>{if(!blob){setError("Could not capture the photo. Please try again.");return}setCapturedFile(new File([blob],`receipt-${Date.now()}.jpg`,{type:"image/jpeg"}));setCapturedPreview(canvas.toDataURL("image/jpeg",.9));closeCamera()},"image/jpeg",.9);
  }
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setDone(false);
    const file = capturedFile ?? selectedFile;
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) { setError("Upload a JPG, PNG, or WebP receipt up to 8 MB"); setBusy(false); return; }
    try { setResult(await api<Result>("/api/receipts/parse", { image: await toDataUrl(file) }, 90_000)); }
    catch (e) { if (!(e instanceof LimitError)) setError(e instanceof Error ? e.message : "Upload failed"); }
    setBusy(false);
  }
  function confirm() {
    if (!result) return;
    addReceipt(result.extraction, result.purchaseDate);
    writeDemoScenario({ receiptConfirmed: true });
    setDone(true); setResult(null);
  }
  return <div className="mt-8 max-w-2xl">
    {!result && !done && <form onSubmit={upload} className="card p-6"><label htmlFor="receipt" className="block font-black">Take or choose a receipt photo</label><p className="mt-1 text-sm text-[#68766e]">Use your phone or computer camera, or choose an existing JPG, PNG, or WebP image up to 8 MB.</p>
      {!cameraOpen&&!capturedPreview&&<div className="mt-5 flex flex-col gap-3 sm:flex-row"><button type="button" onClick={openCamera} className="button bg-[#164b35] text-white">📷 Use camera</button><label className="button cursor-pointer bg-[#164b35] text-white">{selectedFile?selectedFile.name:"Choose image"}<input id="receipt" name="receipt" type="file" accept="image/*" required={!capturedFile} onChange={(event)=>{setSelectedFile(event.target.files?.[0]??null);setCapturedFile(null);setCapturedPreview("")}} className="sr-only"/></label></div>}
      {cameraOpen&&<div className="mt-5 overflow-hidden rounded-2xl bg-black p-3"><video ref={videoRef} autoPlay playsInline muted className="aspect-[4/3] w-full rounded-xl object-cover"/><div className="mt-3 flex justify-center gap-3"><button type="button" onClick={closeCamera} className="button bg-white/15 text-white">Cancel</button><button type="button" onClick={capturePhoto} className="button bg-white text-[#164b35]">Take photo</button></div></div>}
      {capturedPreview&&<div className="mt-5"><Image src={capturedPreview} alt="Captured receipt preview" width={1200} height={900} unoptimized className="max-h-[28rem] w-full rounded-2xl bg-black object-contain"/><button type="button" onClick={()=>{setCapturedFile(null);setCapturedPreview("")}} className="button mt-3 border">Retake or choose another</button></div>}
      <canvas ref={canvasRef} className="hidden"/><button disabled={busy||cameraOpen||(!capturedFile&&!selectedFile)} className="button mt-5 bg-[#164b35] text-white disabled:opacity-50">{busy ? "Reading receipt…" : "Review receipt"}</button></form>}
    {result && <div className="card p-6"><p className="eyebrow">Review before adding</p><h2 className="mt-2 text-2xl font-black">{result.extraction.items.length} groceries found</h2><p className="mt-2 rounded-xl bg-[#edf5ef] p-3 text-sm font-bold text-[#287557]">🧠 AI interpreted receipt text and normalized grocery names.</p><p className="mt-2 text-sm text-[#68766e]">Purchase date: {result.purchaseDate}</p><ul className="mt-5 divide-y">{result.extraction.items.map((item,index)=><li key={`${item.raw_receipt_name}-${index}`} className="flex items-center justify-between gap-3 py-3"><span><small className="block text-[#68766e]">Raw: {item.raw_receipt_name}</small><b>Normalized: {item.normalized_name}</b></span>{(item.needs_review||item.confidence<.75)&&<span className="rounded-full bg-[#fff0d7] px-2 py-1 text-xs font-black">Review</span>}</li>)}</ul><div className="mt-5 flex gap-3"><button onClick={()=>setResult(null)} className="button border">Cancel</button><button onClick={confirm} disabled={busy} className="button bg-[#164b35] text-white disabled:opacity-50">{busy ? "Adding…" : "Confirm & add to pantry"}</button></div></div>}
    {done && <div className="card p-6"><h2 className="text-2xl font-black">Groceries added ✓</h2><p className="mt-2 text-[#526259]">Your groceries are in your kitchen, saved in this browser.</p><a href="/dashboard" className="button mt-5 bg-[#164b35] text-white">Open kitchen</a></div>}
    {error && <p role="alert" className="mt-4 font-bold text-[#a63328]">{error}</p>}
  </div>;
}

