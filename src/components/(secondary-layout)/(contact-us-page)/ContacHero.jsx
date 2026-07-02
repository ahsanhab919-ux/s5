import { officeAddress } from "@/_mock/officeAdress";
import * as motion from "motion/react-client";

export default function ContactHero() {
  return (
    <div
      className="relative h-auto bg-cover bg-center px-4 py-10 sm:h-[560px] sm:px-6 md:px-10"
      style={{
        backgroundImage: "url(/overlay_1.svg), url(/cotact-hero.jpg)",
      }}
    >
      <div className="container mx-auto">
        <div>
          <div className="text-primary flex flex-row">
            {["W", "h", "e", "r", "e"].map((w, i) => (
              <motion.h1
                key={i}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 * (i + 1) }}
                className="text-6xl font-bold"
              >
                {w}
              </motion.h1>
            ))}
          </div>

          <div className="text-primary-foreground inline-flex flex-row gap-2">
            {["to", "find", "us?"].map((w, i) => (
              <motion.p
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 * (i + 1) }}
                className="text-6xl font-bold"
              >
                {w}
              </motion.p>
            ))}
          </div>

          <div className="text-primary-foreground mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {officeAddress.map((office, i) => (
              <motion.div
                key={office.name}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 * (i + 1) }}
                className="pr-0 md:pr-5"
              >
                <h6 className="text-lg font-semibold">{office.name}</h6>
                <p className="text-sm">{office.address}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
