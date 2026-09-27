import Dashboard from "./dashboard"
import Navbar from "./navbar"

export default function Rightbox(){
    return (
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-shrink-0">
                <Navbar/>
            </div>
            <div className="flex-1 overflow-y-auto">
                <Dashboard/>
            </div>
        </div>
    )
}