"use client"
import { useState, useRef } from "react"
import axios from "axios"
import Navbar from "../components/navbar/Navbar"
import Popup from "../components/Popup"
import GenreTracksDisplay from "../components/GenreTracksDisplay"

export default function UploadPicturePage() {
  const [musicKeywords, setMusicKeywords] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPopup, setShowPopup] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileInputRef.current?.files?.[0]) {
      setError("Please select an image first")
      return
    }

    setLoading(true)
    setError("")
    setMusicKeywords("pop")

    const formData = new FormData()
    formData.append("file", fileInputRef.current.files[0])

  //   try {
  //     const response = await axios.post("http://127.0.0.1:5000/analyze-image", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     })

  //     if (response.data.music_keywords) {
  //       setMusicKeywords(response.data.music_keywords)
  //       setShowPopup(true)
  //     } else {
  //       setError("No music keywords found in the image.")
  //     }
  //   } catch (error) {
  //     console.error('Failed to analyze image:', error)
  //     setError("Failed to analyze image. Please try again.")
  //   } finally {
  //     setLoading(false)
  //   }
    }

  const handleClosePopup = () => {
    setShowPopup(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
      <div className="z-10 w-full max-w-4xl px-4">
        <Navbar />
        <h1 className="text-4xl font-bold mb-4 text-center">Create Music from Pictures</h1>
        <div className="w-full max-w-lg mx-auto bg-white/80 rounded-lg p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                ref={fileInputRef}
                className="hidden"
                id="imageInput"
              />
              <label
                htmlFor="imageInput"
                className="cursor-pointer bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-bold py-2 px-4 rounded shadow-lg transform hover:scale-105 transition-transform duration-300"
              >
                Select Image
              </label>
              {selectedImage && (
                <div className="mt-4">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="max-w-full h-auto rounded-lg shadow-md"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !selectedImage}
                className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:from-yellow-500 hover:via-red-500 hover:to-pink-500 text-white font-bold py-2 px-4 rounded shadow-lg transform hover:scale-105 transition-transform duration-300 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Generate Music"}
              </button>
            </div>
          </form>
        </div>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        {musicKeywords && <GenreTracksDisplay keywords={musicKeywords} />}
      </div>

      <video autoPlay loop muted className="absolute top-0 left-0 w-full h-full object-cover z-0">
        <source src="/vinylDisk.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {showPopup && <Popup text={musicKeywords} onClose={handleClosePopup} />}
    </div>
  )
}
