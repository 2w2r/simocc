'use client';

import { useRouter } from 'next/navigation';
import Link from "next/link"

import { CircleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"



export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

  return (
    <main className="flex h-lvh flex-col items-center justify-center gap-10">
        <CircleAlert className='size-16'/>
        <h1 className="text-5xl font-semibold">ERROR</h1>
        <p>Something went wrong</p>
        <div className='grid grid-cols-3 gap-3'>
            <Button asChild variant='secondary' className='px-5 hover:bg-secondary/80'>
                <Link href="/">
                Return Home
                </Link>
            </Button>
            <Button onClick={() => router.back()} variant='secondary' className='hover:bg-secondary/80'>
                Go Back
            </Button>
            <Button onClick={reset} className='hover:bg-primary/80'>
                Try again
            </Button>
        </div>
    </main>
  );
}