import { jsonLdString } from "@/lib/seo";

/** Data terstruktur schema.org; <script> biasa (bukan next/script) karena isinya data, bukan kode. */
export function JsonLd({ data }: { data: object | object[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
