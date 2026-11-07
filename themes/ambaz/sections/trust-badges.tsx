import type { SectionRenderProps } from "@sellosy/theme";
import type { trustBadges } from "../manifest";
import { TrustBadges as AmbazTrustBadges } from "../src/components/shared/TrustBadges";

/** TrustBadges Ambaz dengan isi dari customizer. */
export function TrustBadges({ blocks, editor }: SectionRenderProps<typeof trustBadges>) {
  const badges = blocks.filter((block) => block.settings.title).map(({ settings }) => ({ icon: settings.icon, title: settings.title, description: settings.text }));
  if (badges.length === 0) return null;
  return <AmbazTrustBadges badges={badges} editor={editor} />;
}
