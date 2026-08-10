import { LayoutShell } from "@/app/layout-shell";

export default function MainLayout({ children }: { children: React.ReactNode }) {
	return (
		<LayoutShell>
			{children}
		</LayoutShell>
	);
}
