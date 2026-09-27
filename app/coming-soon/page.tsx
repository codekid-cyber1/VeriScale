import Leftbar from "@/components/leftbar"
import Navbar from "@/components/navbar"
import Link from "next/link"

export default function ComingSoon() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FBFBFB]">
      <Leftbar/>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-shrink-0">
          <Navbar/>
        </div>
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">Coming Soon</h1>
            <p className="text-lg text-gray-500 max-w-md">
                We're working hard to bring this feature to life. Check back later!
            </p>
            <Link href="/" className="px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm mt-4">
                Back to Dashboard
            </Link>
        </div>
      </div>
    </div>
  )
}
