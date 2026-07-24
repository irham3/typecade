"use client"

export function WordStream({
	currentWord,
	upcomingWords,
	caretIndex,
	wordDirty,
}: {
	currentWord: string
	upcomingWords: string[]
	caretIndex: number
	wordDirty: boolean
}) {
	// Active word formatting
	const typed = currentWord.slice(0, caretIndex)
	const remaining = currentWord.slice(caretIndex)
	
	// Just showing upcoming words for now, in a real implementation we'd probably keep track of history
	const nextLine = upcomingWords.join(" ")

	return (
		<div className="flex flex-col items-center gap-4 text-center">
			{/* <p className="text-[28px] text-text-dim">previous words here...</p> */}
			
			<p id="active-word" className={`text-5xl font-bold ${wordDirty ? "text-acc-red" : "text-acc-green"}`}>
				<span className="text-text-hi">{typed}</span>
				{remaining.length > 0 && (
					<span className="relative">
						<span className="absolute bottom-0 left-0 h-1 w-full bg-text-hi opacity-50" />
						{remaining[0]}
					</span>
				)}
				{remaining.slice(1)}
			</p>
			
			<p className="text-[28px] text-text-dim truncate w-full max-w-2xl">{nextLine}</p>
		</div>
	)
}
