"use client";
import { testimonials } from "@/_mock/testimonials";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import * as motion from "motion/react-client";
import { useState } from "react";

const StarRating = ({ value, max = 5, size = "small" }) => {
  const sizeClasses = size === "small" ? "size-4" : "size-6";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, index) => (
        <Star
          key={index}
          className={cn(
            sizeClasses,
            index < value
              ? "fill-primary text-primary"
              : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
};

export default function Testimonials() {
  const [activeSlide, setActiveSlide] = useState(0);

  const handlePrevious = () => {
    setActiveSlide((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mb-24">
      <motion.h2
        initial={{ y: 30, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        viewport={{ once: true }}
        className="mb-12 text-center text-2xl leading-tight font-bold sm:text-3xl md:mb-16 md:text-5xl lg:text-5xl"
      >
        Elevating Client Experiences to
        <br />
        New Heights with{" "}
        <span className="from-primary via-primary to-primary/80 bg-gradient-to-br bg-clip-text font-bold text-transparent">
          Shothik AI
        </span>
      </motion.h2>

      <div className="relative mb-8 flex justify-center gap-6">
        {/* Previous slide (semi-visible) */}
        <div className="bg-card hidden h-[400px] w-[400px] scale-90 overflow-hidden rounded-xl p-8 opacity-50 transition-all duration-500 ease-in-out md:block">
          <div className="mb-4 flex items-center transition-all duration-500 ease-in-out">
            <Avatar className="mr-4 size-12 transition-all duration-500 ease-in-out">
              <AvatarImage
                src={
                  testimonials[
                    (activeSlide - 1 + testimonials.length) %
                      testimonials.length
                  ].image
                }
              />
              <AvatarFallback>
                {testimonials[
                  (activeSlide - 1 + testimonials.length) % testimonials.length
                ].name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="relative flex w-full items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium transition-all duration-500 ease-in-out">
                  {
                    testimonials[
                      (activeSlide - 1 + testimonials.length) %
                        testimonials.length
                    ].name
                  }
                </p>
                <p className="text-muted-foreground transition-all duration-500 ease-in-out">
                  {
                    testimonials[
                      (activeSlide - 1 + testimonials.length) %
                        testimonials.length
                    ].title
                  }
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-muted-foreground mb-4 font-medium transition-all duration-500 ease-in-out">
            {
              testimonials[
                (activeSlide - 1 + testimonials.length) % testimonials.length
              ].headline
            }
          </h3>
          <p className="text-muted-foreground transition-all duration-500 ease-in-out">
            {
              testimonials[
                (activeSlide - 1 + testimonials.length) % testimonials.length
              ].content
            }
          </p>
        </div>

        {/* Active slide */}
        <div className="md:bg-card border-border z-10 h-[400px] w-full overflow-hidden rounded-xl border px-4 py-8 shadow-lg transition-all duration-500 ease-in-out hover:shadow-xl sm:h-[300px] sm:px-8 md:h-[400px] md:w-[500px] lg:h-[400px] xl:h-[400px]">
          <div className="mb-4 flex items-center transition-all duration-500 ease-in-out">
            <Avatar className="mr-4 size-12">
              <AvatarImage src={testimonials[activeSlide].image} />
              <AvatarFallback>
                {testimonials[activeSlide].name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="relative flex w-full items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium transition-all duration-500 ease-in-out">
                  {testimonials[activeSlide].name}
                </p>
                <p className="text-muted-foreground text-sm transition-all duration-500 ease-in-out">
                  {testimonials[activeSlide].title}
                </p>
              </div>
              <div className="absolute top-0 right-0 transition-all duration-500 ease-in-out">
                <StarRating value={testimonials[activeSlide].rating} />
              </div>
            </div>
          </div>

          <h3 className="text-muted-foreground mb-4 text-lg font-medium transition-all duration-500 ease-in-out sm:text-2xl md:text-2xl">
            {testimonials[activeSlide].headline}
          </h3>
          <p className="text-muted-foreground text-lg transition-all duration-500 ease-in-out sm:text-base md:text-base">
            {testimonials[activeSlide].content}
          </p>
        </div>

        {/* Next slide (semi-visible) */}
        <div className="bg-card hidden h-[400px] w-[400px] scale-90 overflow-hidden rounded-xl p-8 opacity-50 transition-all duration-500 ease-in-out md:block">
          <div className="mb-4 flex items-center transition-all duration-500 ease-in-out">
            <Avatar className="mr-4 size-12 transition-all duration-500 ease-in-out">
              <AvatarImage
                src={
                  testimonials[(activeSlide + 1) % testimonials.length].image
                }
              />
              <AvatarFallback>
                {testimonials[
                  (activeSlide + 1) % testimonials.length
                ].name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="relative flex w-full items-center justify-between">
              <div>
                <p className="text-muted-foreground font-medium transition-all duration-500 ease-in-out">
                  {testimonials[(activeSlide + 1) % testimonials.length].name}
                </p>
                <p className="text-muted-foreground text-sm transition-all duration-500 ease-in-out">
                  {testimonials[(activeSlide + 1) % testimonials.length].title}
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-muted-foreground mb-4 font-medium transition-all duration-500 ease-in-out">
            {testimonials[(activeSlide + 1) % testimonials.length].headline}
          </h3>
          <p className="text-muted-foreground transition-all duration-500 ease-in-out">
            {testimonials[(activeSlide + 1) % testimonials.length].content}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            className="text-primary hover:bg-primary hover:text-primary-foreground size-10 shadow-md transition-all duration-300"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {testimonials.map((_, index) => (
            <div
              key={index}
              onClick={() => setActiveSlide(index)}
              className={cn(
                "mx-1 size-2.5 cursor-pointer rounded-full transition-colors duration-300",
                index === activeSlide ? "bg-primary" : "bg-muted",
              )}
            />
          ))}

          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            className="text-primary hover:bg-primary hover:text-primary-foreground size-10 shadow-md transition-all duration-300"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
