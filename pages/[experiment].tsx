import Image from "next/image";

import { getExperimentPaths, getExperimentProps } from "../lib/variations";
import { GetStaticPropsContext } from "next";

export default function ProductPage(props: any) {
  console.log({ props });

  return (
    <main className="mx-auto min-h-screen items-center max-w-[800px] pt-[200px]">
      <div className="flex items-center">
        <Image
          src={`/${props.image.image_url}.jpeg`}
          alt="T-shirt"
          width="600"
          height="600"
        />
        <div className="flex flex-col justify-center items-center h-full w-full">
          <h1 className="text-3xl mb-2">{props.headline.headline}</h1>
          <button className="bg-gray-200 p-2 rounded-md">
            {props.button_text.button_text}
          </button>
        </div>
      </div>
    </main>
  );
}

export async function getStaticPaths() {
  const paths = getExperimentPaths();

  return {
    paths,
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }: GetStaticPropsContext) {
  const experiments = getExperimentProps(params);

  console.log(params);

  return {
    props: experiments,
    revalidate: 60,
  };
}
