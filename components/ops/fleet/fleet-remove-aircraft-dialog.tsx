import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Minus } from "lucide-react"

export function FleetRemoveAircraftDialog({
  selectedRegistrations,
  onConfirm,
}: {
  selectedRegistrations: string[]
  onConfirm: () => void
}) {
  if (selectedRegistrations.length === 0) return null

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="default" size="icon" className="ml-2">
          <Minus />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Aircraft?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <span>
              <span className="flex flex-col gap-0.5">
                {selectedRegistrations.map((reg) => (
                  <span key={reg} className="text-primary font-light">
                    {reg}
                  </span>
                ))}
              </span>
              <span className="mt-2 block">
                This action cannot be undone.
              </span>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="secondary">Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant="destructive">
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// deleteButton={
//   selectedIds.length > 0 ? (
//     <AlertDialog>
//       <AlertDialogTrigger asChild>
//         <Button variant="default" size="icon" className="ml-2">
//           <Minus />
//         </Button>
//       </AlertDialogTrigger>
//       <AlertDialogContent>
//         <AlertDialogHeader>
//           <AlertDialogTitle>
//             Remove {selectedIds.length} aircraft from fleet?
//           </AlertDialogTitle>
//           <AlertDialogDescription>
//             <span className="flex flex-col gap-0.5">
//               {selectedRegistrations.map((reg) => (
//                 <span key={reg} className="text-primary font-light">
//                   {reg}
//                 </span>
//               ))}
//             </span>
//             <span className="mt-2 block">
//               This action cannot be undone.
//             </span>
//           </AlertDialogDescription>
//         </AlertDialogHeader>
//         <AlertDialogFooter>
//           <AlertDialogCancel variant="secondary">
//             Cancel
//           </AlertDialogCancel>
//           <AlertDialogAction
//             onClick={handleRemoveSelected}
//             variant="destructive"
//           >
//             Remove
//           </AlertDialogAction>
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>
//   ) : null
// }