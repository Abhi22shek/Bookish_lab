"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

const navItems = [
    {label: "Library" , href:"/"},
    {label:"Add New", href: "/books/new"}
]

const Navbar = () => {

    const pathname = usePathname()
    const {user} = useUser()

    return (
        <header className="w-full z-50 fixed bg-[var(--bg-primary)]">
            <div className="wrapper flex navbar-height py-4 justify-between items-center">
                <Link href="/" className="gap-0.5 items-center flex">
                    <Image src="/assets/logo.png" alt="BookifiedLogo"
                    width={42} height={26}
                    />
                    <span className="logo-text">Bookified</span>
                </Link>

                <nav className="w-fit flex gap-7.5 items-center">
                   {navItems.map(({label,href}) => {
                    const isActive = pathname === href ||
                        (href !== '/' && pathname.startsWith(href));

                        return (
                            <Link  href = {href} key={label} 
                                className={cn('nav-link-base',isActive ? 'nav-link-active' : 'text-black hover:opacity-70')}
                            >
                                {label}
                            </Link>
                        )
                   })}
                   
                  <div className="flex gap-7.5 items-center">
                     <SignedOut>
                       <SignInButton mode="modal" />
                   </SignedOut>
                   <SignedIn>
                       <div className="nav-user-link">
                            <UserButton />
                            {user?.firstName && (
                                <Link href="/subscriptions"
                                className="nav-user-name">
                                    {user.firstName}
                                </Link>
                            )}
                       </div>
                   </SignedIn>
                  </div>
                </nav>
            </div>
        </header>
    )
}

export default Navbar