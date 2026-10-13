import { formatDate, PageContent, type InfoPageProps } from "@sellosy/theme";
import s from "./editorial.module.css";

export function InfoPage({ page }: InfoPageProps) {
  return (
    <main className={`${s.main} ${s.block} ${s.info}`}>
      <header className={s.pageHead}>
        <p className={s.eyebrow}>Informasi</p>
        <h1 className={s.pageTitle}>{page.title}</h1>
        {page.updated_at && <p className={s.updated}>Diperbarui {formatDate(new Date(page.updated_at))}</p>}
      </header>
      <PageContent page={page} className={s.prose} />
    </main>
  );
}
