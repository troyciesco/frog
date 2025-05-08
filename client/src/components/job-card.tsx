import type { Progress } from "@/types"
import { Chart } from "./chart"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "./ui/card"
import { cn } from "@/lib/utils"

export function JobCard({
	id,
	title,
	progress,
	state
}: {
	id: string
	title: string
	progress: Progress
	state: string
}) {
	return (
		<Card className={cn(state === "active" && "animate-pulse bg-blue-100")}>
			<CardHeader>
				<CardTitle>
					#{id}: {title}
				</CardTitle>
				<CardDescription>
					{state === "active" ? (
						<span className="text-xl font-bold">{state}</span>
					) : (
						state
					)}
				</CardDescription>
				<CardContent>
					<div className="grid grid-cols-2 gap-2">
						{progress?.posts?.total > 0 && (
							<div>
								<Chart
									label="Posts"
									succeeded={progress.posts.succeeded}
									failed={progress.posts.failed}
									remaining={
										progress.posts.total -
										(progress.posts.succeeded + progress.posts.failed)
									}
								/>
							</div>
						)}
						{progress?.pages?.total > 0 && (
							<div>
								<Chart
									label="Pages"
									succeeded={progress.pages.succeeded}
									failed={progress.pages.failed}
									remaining={
										progress.pages.total -
										(progress.pages.succeeded + progress.pages.failed)
									}
								/>
							</div>
						)}
						{progress?.tags?.total > 0 && (
							<div>
								<Chart
									label="Tags"
									succeeded={progress.tags.succeeded}
									failed={progress.tags.failed}
									remaining={
										progress.tags.total -
										(progress.tags.succeeded + progress.tags.failed)
									}
								/>
							</div>
						)}
						{progress?.tiers?.total > 0 && (
							<div>
								<Chart
									label="Tiers"
									succeeded={progress.tiers.succeeded}
									failed={progress.tiers.failed}
									remaining={
										progress.tiers.total -
										(progress.tiers.succeeded + progress.tiers.failed)
									}
								/>
							</div>
						)}
						{progress?.newsletters?.total > 0 && (
							<div>
								<Chart
									label="Newsletters"
									succeeded={progress.newsletters.succeeded}
									failed={progress.newsletters.failed}
									remaining={
										progress.newsletters.total -
										(progress.newsletters.succeeded +
											progress.newsletters.failed)
									}
								/>
							</div>
						)}
					</div>
				</CardContent>
			</CardHeader>
		</Card>
	)
}
