import Image from "next/image";
import Link from "next/link";
import { useLanguageKey } from "@/hooks/use-i18n";

export default function NotFound() {
  // Not found translations
  const notFoundTranslations = useLanguageKey("notFound");

  return (
    <main className="flex flex-col gap-2 justify-center items-center h-screen w-screen">
      <h2 className="cursor-default select-none">
        {notFoundTranslations.pageTitle}
      </h2>
      <p className="cursor-default select-none">
        {notFoundTranslations.pageDescription}
      </p>

      <Image
        className="cursor-default select-none"
        src="/assets/404-error-with-a-cute-animal-animate.svg"
        alt={notFoundTranslations.imageAlt}
        width={500}
        height={500}
      />

      <Link
        className="select-none bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 uppercase"
        href="/"
      >
        {notFoundTranslations.backToDashboard}
      </Link>
    </main>
  );
}
