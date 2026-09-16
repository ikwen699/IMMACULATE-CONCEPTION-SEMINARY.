import { BookMarked, FlaskConical, Globe2 } from 'lucide-react'

const jssSubjects = [
  'Mathematics',
  'English Language',
  'Basic Science & Technology',
  'Christian Religious Studies',
  'Social Studies',
  'Civic Education',
  'French Language',
  'Agricultural Science',
  'Home Economics',
  'Physical & Health Education',
  'Fine Arts',
  'Music',
]

const ssScienceSubjects = [
  'Mathematics',
  'English Language',
  'Physics',
  'Chemistry',
  'Biology',
  'Further Mathematics',
  'Agricultural Science',
  'Computer Studies',
  'Christian Religious Studies',
]

const ssArtsSubjects = [
  'Literature in English',
  'Government',
  'Christian Religious Studies',
  'History',
  'French Language',
  'Fine Arts',
  'Economics',
  'Civic Education',
]

export default function Academics() {
  return (
    <section id="academics" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="text-center mb-14">
          <span className="inline-block text-[11px] font-semibold tracking-wide text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase mb-4">
            Academic Programmes
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
            Building a Strong Academic Foundation
          </h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto leading-relaxed">
            Our curriculum covers Junior Secondary (JSS 1–3) and Senior Secondary (SS 1–3),
            offering Science and Arts tracks to suit every student&apos;s strength.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <BookMarked className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Junior Secondary</h3>
                <p className="text-xs text-gray-400 font-medium">JSS 1 – JSS 3</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              A broad foundation programme preparing students for senior-level academics
              through a balanced mix of sciences, humanities, and creative arts.
            </p>
            <ul className="space-y-2">
              {jssSubjects.map((s) => (
                <li
                  key={s}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Senior Secondary — Science</h3>
                <p className="text-xs text-gray-400 font-medium">SS 1 – SS 3</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              A rigorous science-track programme equipping students with deep knowledge in
              STEM disciplines for university placement and future careers.
            </p>
            <ul className="space-y-2">
              {ssScienceSubjects.map((s) => (
                <li
                  key={s}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Senior Secondary — Arts</h3>
                <p className="text-xs text-gray-400 font-medium">SS 1 – SS 3</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              An enriching arts-track programme fostering critical thinking through
              literature, social sciences, and creative disciplines.
            </p>
            <ul className="space-y-2">
              {ssArtsSubjects.map((s) => (
                <li
                  key={s}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
