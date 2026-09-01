import type { Review } from "@/types/domain";

/**
 * Demo testimonials. Content is representative, not sourced from real
 * customers — copy avoids unverifiable scale claims per brand guidelines.
 */
export const reviews: Review[] = [
  {
    id: "rev-1",
    authorName: "Ananya R.",
    authorInitial: "A",
    serviceCategory: "AC & HVAC",
    rating: 5,
    quote:
      "I compared three technicians in under a minute and booked one who showed up the next morning. No back-and-forth calls, no guessing on price.",
    date: "2 weeks ago",
  },
  {
    id: "rev-2",
    authorName: "Devraj K.",
    authorInitial: "D",
    serviceCategory: "Home Repair",
    rating: 5,
    quote:
      "The verification badges actually meant something — I could tell who was a real, established business before reaching out.",
    date: "1 month ago",
  },
  {
    id: "rev-3",
    authorName: "Meera S.",
    authorInitial: "M",
    serviceCategory: "Cleaning",
    rating: 4,
    quote:
      "Rebooked the same cleaner twice through Servora. Availability was accurate both times, which is rarer than it should be.",
    date: "3 weeks ago",
  },
  {
    id: "rev-4",
    authorName: "Karthik V.",
    authorInitial: "K",
    serviceCategory: "Electrical",
    rating: 5,
    quote:
      "Asked the assistant for an electrician who could come same-day. It narrowed things down instantly and I booked without leaving the chat.",
    date: "5 days ago",
  },
  {
    id: "rev-5",
    authorName: "Priya N.",
    authorInitial: "P",
    serviceCategory: "Photography",
    rating: 5,
    quote:
      "Found a photographer whose portfolio matched exactly what I wanted, with pricing upfront. Booking took less time than the phone call would have.",
    date: "1 week ago",
  },
  {
    id: "rev-6",
    authorName: "Farhan A.",
    authorInitial: "F",
    serviceCategory: "Device Repair",
    rating: 4,
    quote:
      "Straightforward experience end to end — search, compare, pay, done. The status updates kept me from having to ask what was going on.",
    date: "4 days ago",
  },
];
