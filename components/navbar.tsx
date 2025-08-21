"use client"

import { Button } from "@/components/ui/button"
import { LogIn, LogOut, User } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/toast-provider"

export function Navbar() {
  const { user, signOut } = useAuth()
  const { addToast } = useToast()

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        addToast('Failed to sign out', 'error')
      } else {
        addToast('Signed out successfully', 'success')
      }
    } catch (error) {
      addToast('An error occurred while signing out', 'error')
    }
  }

  return (
    <nav className="bg-white shadow-sm border-b-4 border-[#FFC72C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#990000] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">USC</span>
            </div>
            <span className="text-xl font-bold text-[#990000]">Scrim Scheduler</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="border-[#990000] text-[#990000] hover:bg-[#990000] hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-[#990000] hover:bg-[#800000] text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
