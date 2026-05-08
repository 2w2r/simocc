'use client';

import { useRouter } from 'next/navigation';
import Link from "next/link"

import { GlobeOff } from "lucide-react"

import { Button } from "@/components/ui/button"


export default function NotFound() {
    const router = useRouter();
  return (
    <main className="flex h-lvh flex-col items-center justify-center gap-10">
        <GlobeOff className='size-16'/>
        <h1 className="text-5xl font-semibold">404 ERROR</h1>
        <p>The requested page was not found</p>
        <div className='grid grid-cols-2 gap-3'>
            <Button asChild variant='secondary' className='px-5 hover:bg-secondary/80'>
                <Link href="/">
                Return Home
                </Link>
            </Button>
            <Button onClick={() => router.back()} className='hover:bg-primary/80'>
                Go Back
            </Button>
        </div>
    </main>
  );
}