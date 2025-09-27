import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col gap-2 justify-center items-center h-screen w-screen">
      <h2 className="cursor-default select-none">Página não encontrada</h2>
      <p className="cursor-default select-none">
        A página que você solicitou mudou ou esta em desenvolvimento
      </p>

      <Image
        className="cursor-default select-none"
        src="/assets/404-error-with-a-cute-animal-animate.svg"
        alt="Imagem de um gato pendurado no numero 404 indicando que a página não foi encontrada"
        width={500}
        height={500}
      />

      <Link
        className="select-none bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 uppercase"
        href="/"
      >
        Voltar para Dashboard
      </Link>
    </main>
  );
}
