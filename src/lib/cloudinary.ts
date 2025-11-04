
export const CLOUDINARY_CONFIG = {
  cloudName: 'ddc1eidno',
  uploadPreset: 'Photos'
}

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset)

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()

      // Handle specific 400 error for upload preset issues
      if (response.status === 400) {
        throw new Error(`Upload preset "${CLOUDINARY_CONFIG.uploadPreset}" not found or not configured properly. Please check your Cloudinary settings.`)
      }
      
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.secure_url
  } catch (error) {
    // Provide more specific error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error - please check your internet connection')
    }
    
    throw error
  }
}
