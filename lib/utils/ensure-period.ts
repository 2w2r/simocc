export function ensurePeriod(message: string): string {
    return message.endsWith(".") ? message : `${message}.`
}