import {
	Sidebar,
	SidebarContent,
	SidebarHeader,
	SidebarRail
} from "@/components/ui/sidebar"
import { Link } from "@tanstack/react-router"

// const data = {
// 	navMain: [
// 		{
// 			title: "Getting Started",
// 			url: "#",
// 			items: [
// 				{
// 					title: "Installation",
// 					url: "#",
// 					isActive: true
// 				},
// 				{
// 					title: "Project Structure",
// 					url: "#"
// 				}
// 			]
// 		}
// 	]
// }
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<div className="w-full flex justify-center">
					<Link to="/">
						<img src="/frog-logo.svg" alt="Frog logo" width={149} height={69} />
					</Link>
				</div>
			</SidebarHeader>
			<SidebarContent>
				{/* Saved in case i ever add job pages etc */}
				{/* {data.navMain.map((item) => (
					<SidebarGroup key={item.title}>
						<SidebarGroupLabel>{item.title}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{item.items.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild isActive={item.isActive}>
											<a href={item.url}>{item.title}</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))} */}
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	)
}
