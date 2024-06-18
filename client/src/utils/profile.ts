
export function ProcessProfileSource(src: string){

    const srcBinary = atob(src);
    const binaryBuff = new Uint8Array(srcBinary.length)

    binaryBuff.forEach((_, index) => {
        binaryBuff[index] = srcBinary.charCodeAt(index)
    })

    const blob = new Blob([binaryBuff])
    const profileSrc = URL.createObjectURL(blob)

    return profileSrc
}
