import { apiSlice } from '../../app/api/apiSlice';

/**
 * Course categories: one list shared with the landing site. The LMS server proxies the landing API
 * (GET for every role, writes for admins), so both sites always show the same categories.
 * A course stores the category's slug; older courses may still hold a free-text name.
 */
export const categoriesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    createCategory: builder.mutation({
      query: (data) => ({ url: '/categories', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    updateCategory: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/categories/${id}`, method: 'PUT', body: data }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
    deleteCategory: builder.mutation({
      query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Category', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoriesApi;

/** The category name in the UI language (az / en / ru), falling back to Azerbaijani. */
export const categoryName = (category, lang) => {
  if (!category) return '';
  const key = { en: 'nameEn', ru: 'nameRu' }[lang] || 'nameAz';
  return category[key] || category.nameAz || category.slug;
};

/** What a course's `category` value should read as: the matching category's name, else the stored text. */
export const courseCategoryLabel = (value, categories, lang) => {
  const match = categories?.find((c) => c.slug === value);
  return match ? categoryName(match, lang) : value || '';
};

const AZ_FOLD = { ə: 'e', ı: 'i', ö: 'o', ü: 'u', ş: 's', ç: 'c', ğ: 'g', İ: 'i' };

/** URL slug from a name: Azerbaijani letters folded to ASCII, lowercase, hyphen-separated. */
export const slugify = (text) =>
  (text || '')
    .replace(/[əıöüşçğİ]/gi, (ch) => AZ_FOLD[ch] ?? AZ_FOLD[ch.toLowerCase()] ?? ch)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
