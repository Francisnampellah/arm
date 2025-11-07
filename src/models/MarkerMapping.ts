import mongoose, { Schema, Document, Model } from 'mongoose';

export interface MarkerMappingDoc extends Document {
  markerId: number; // Numeric barcode value (for AR.js barcode markers)
  qrCodeData: string; // Decoded QR string for lookup / UX
  objectName: string; // Friendly name of the rendered asset
  modelUrl: string; // URL to glTF/GLB/model asset
  active: boolean;
}

const MarkerMappingSchema = new Schema<MarkerMappingDoc>({
  markerId: { type: Number, required: true, unique: true },
  qrCodeData: { type: String, required: true, unique: true },
  objectName: { type: String, required: true },
  modelUrl: { type: String, required: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const MarkerMapping: Model<MarkerMappingDoc> = mongoose.models.MarkerMapping || mongoose.model<MarkerMappingDoc>('MarkerMapping', MarkerMappingSchema);


