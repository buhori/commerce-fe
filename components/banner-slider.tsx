"use client";

import { Button, buttonClasses } from "@/components/ui/button";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Banner } from "@/lib/store-api";
import { Icon } from "./icons";

const INTERVAL = 6000;

export function BannerSlider({ banners }: { banners: Banner[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const multiple = banners.length > 1;
  // The first slide's artwork sets the height; these only reserve space and size the copy on mobile.
  const squareOnMobile = banners.every((banner) => banner.mobile_image);
  const wideOnMobile = banners.every((banner) => !banner.mobile_image);

  const show = useCallback((index: number) => {
    const element = track.current;
    if (!element) return;
    const next = (index + banners.length) % banners.length;
    element.scrollTo({ left: next * element.clientWidth, behavior: reducedMotion ? "auto" : "smooth" });
    setActive(next);
  }, [banners.length, reducedMotion]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Scroll position drives the active dot, so swipes and buttons stay in sync.
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const update = () => setActive(Math.round(element.scrollLeft / Math.max(1, element.clientWidth)));
    element.addEventListener("scroll", update, { passive: true });
    return () => element.removeEventListener("scroll", update);
  }, []);

  // Autoplay stops while the visitor points at, focuses or pauses the slider.
  const autoplay = multiple && !paused && !hovered && !reducedMotion;
  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) show(active + 1);
    }, INTERVAL);
    return () => window.clearInterval(timer);
  }, [autoplay, active, show]);

  return (
    <section
      className={`banner-slider container ${squareOnMobile ? "banner-square-mobile" : wideOnMobile ? "banner-wide-mobile" : ""}`}
      aria-roledescription="carousel"
      aria-label="Promo toko"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHovered(false); }}
    >
      <div className="banner-viewport">
        <div className="banner-track" ref={track} aria-live={autoplay ? "off" : "polite"}>
          {banners.map((banner, index) => (
            <div className="banner-slide" key={banner.id} role="group" aria-roledescription="slide"
              aria-label={`${index + 1} dari ${banners.length}${banner.title ? `: ${banner.title}` : ""}`}
              aria-hidden={index !== active} inert={index !== active}>
              <SlideLink link={banner.link} label={banner.title || `Banner ${index + 1}`}>
                <picture>
                  {banner.mobile_image && <source media="(max-width: 700px)" srcSet={banner.mobile_image} />}
                  {/* A plain <img> inside <picture>: next/image cannot switch sources per breakpoint. */}
                  <img src={banner.image} alt={banner.title || ""} loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"} decoding="async" />
                </picture>
                {(banner.title || banner.subtitle || banner.button_label) && (
                  <div className="banner-copy">
                    {banner.title && <h2>{banner.title}</h2>}
                    {banner.subtitle && <p>{banner.subtitle}</p>}
                    {banner.button_label && (
                      <span className={buttonClasses({ variant: "secondary", size: "sm", className: "banner-button" })}>{banner.button_label} <Icon name="arrow" /></span>
                    )}
                  </div>
                )}
              </SlideLink>
            </div>
          ))}
        </div>
      </div>
      {multiple && (
        <div className="banner-controls">
          <span className="banner-count" aria-hidden="true">
            <strong>{String(active + 1).padStart(2, "0")}</strong>
            <span>/</span>{String(banners.length).padStart(2, "0")}
          </span>
          <div className="banner-dots" role="group" aria-label="Pilih banner">
            {banners.map((banner, index) => (
              <button type="button" key={banner.id} className="banner-dot" aria-current={index === active}
                aria-label={`Banner ${index + 1}`} onClick={() => show(index)} />
            ))}
          </div>
          <div className="banner-actions">
            {!reducedMotion && (
              <Button type="button" variant="secondary" size="icon" className="banner-pause" onClick={() => setPaused((value) => !value)}
                aria-label={paused ? "Putar slide otomatis" : "Jeda slide otomatis"}>
                {paused ? "▶" : "❚❚"}
              </Button>
            )}
            <Button type="button" variant="secondary" size="icon" className="banner-prev" onClick={() => show(active - 1)} aria-label="Banner sebelumnya">
              <Icon name="arrow" />
            </Button>
            <Button type="button" variant="secondary" size="icon" onClick={() => show(active + 1)} aria-label="Banner berikutnya">
              <Icon name="arrow" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function SlideLink({ link, label, children }: { link: string | null; label: string; children: ReactNode }) {
  if (!link) return <div className="banner-link">{children}</div>;
  if (link.startsWith("/")) return <Link className="banner-link" href={link} aria-label={label}>{children}</Link>;
  return <a className="banner-link" href={link} aria-label={label} target="_blank" rel="noopener noreferrer">{children}</a>;
}
