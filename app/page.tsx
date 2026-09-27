import Leftbar from "@/components/leftbar"
import Rightbox from "@/components/rightbox"

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-[#FBFBFB]">
      <Leftbar/>
      <Rightbox/>
    </div>
  )
}
