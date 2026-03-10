import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Upload a proof photo (delivery lorry, challan, etc.) to Firebase Storage.
 * Returns the download URL or null if storage is not configured.
 */
export async function uploadTransactionPhoto(
  file: File,
  projectId: string,
  materialName: string
): Promise<string | null> {
  try {
    const timestamp = Date.now()
    const safeName = materialName.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const path = `transactions/${projectId}/${safeName}-${timestamp}-${file.name}`
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const url = await getDownloadURL(snapshot.ref)
    return url
  } catch (err) {
    console.error('Photo upload failed:', err)
    return null
  }
}
