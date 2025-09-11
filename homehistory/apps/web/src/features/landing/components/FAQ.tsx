import * as React from 'react';
import { ChevronDown } from 'lucide-react';

type FAQItem = {
  id: string;
  q: string;
  a: string;
};

type Props = {
  faqs: FAQItem[];
};

export function FAQ({ faqs }: Props) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section className="max-w-[1200px] mx-auto px-18 py-8 flex">
      <h2 className="text-[24px] text-start md:text-[28px] text-zinc-900  mb-8 font-bold">
        Frequently Asked Questions
      </h2>

      <div className="max-w-3xl mx-auto">
        <div className="space-y-4 mb-8">
          {faqs.map((faq) => {
            const isOpen = openItems.has(faq.id);
            return (
              <div key={faq.id} className="bg-white rounded-2xl shadow-sm border border-zinc-100">
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-zinc-50 rounded-2xl transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-[15px] font-medium text-zinc-900 pr-4">{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`text-zinc-400 transition-transform flex-shrink-0 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-4">
                    <p className="text-[14px] text-zinc-600 leading-6">{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button className="h-11 py-3 px-6 btn-outline text-[16px] flex items-center duration-300">
            See All FAQs
          </button>
        </div>
      </div>
    </section>
  );
}
