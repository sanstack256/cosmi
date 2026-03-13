import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "./firebase";

const storage = getStorage(app);

export async function uploadCompanyLogo(uid: string, companyId: string, file: File) {
  // Example path: company-logos/uid/companyId/logo.png
  const storageRef = ref(storage, `company-logos/${uid}/${companyId}.png`);

  // Upload the file
  await uploadBytes(storageRef, file);

  // Get URL
  const url = await getDownloadURL(storageRef);

  return url;
}