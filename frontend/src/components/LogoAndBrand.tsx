import { ShoppingBag } from "lucide-react";



export function LogoAndBrand() {
  return (
    <a href="/" className="flex items-center space-x-2 font-bold text-xl">
        <ShoppingBag className="h-6 w-6" />
        <span>Open Market</span>
    </a>
  )
}