import { ok } from "@http/response/ok";
import { cascade } from "@http/route/cascade";
import { byPattern } from "@http/route/by-pattern";

export default cascade(
  byPattern("/v1/*", async (req: Request) => {
    console.log(
      `\n%c==== ${req.url} ====\n`,
      "color: green; font-weight: bold;",
    );

    req.headers.forEach((value, key) => {
      console.log(
        `%c${key}: %c${value}`,
        `font-weight: bold;`,
        `font-weight: normal`,
      );
    });

    if (req.body) {
      await req.body.pipeTo(Deno.stdout.writable, { preventClose: true });
    }

    console.log(`\n%c====\n`, "color: red; font-weight: bold;");

    return ok();
  }),
);
