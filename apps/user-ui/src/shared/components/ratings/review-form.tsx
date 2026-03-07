import { Form, FormControl, FormField, FormItem, FormMessage, Textarea, Button, InputShadcn, FormLabel, FormDescription } from "@e-com/ui";
import StarPicker from "./star-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Props {
  productId: string;
}

const formSchema = z.object({
  rating: z.number().min(1, { message: "Rating is required" }).max(5),
  comment: z.string().min(1, { message: "Description is required" }),
  title: z.string().min(1, { message: "Title is required" }),
});

export default function ReviewForm({ productId }: Props) {
  const queryClient = useQueryClient();

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/product/api/review/${productId}`);
      return res.data.review;
    },
    staleTime: 1000 * 60 * 5,
  });

  const [isPreview, setIsPreview] = useState(!!reviewData);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: reviewData?.rating ?? 0,
      comment: reviewData?.comment ?? "",
      title: reviewData?.title ?? "",
    },
  });

  useEffect(() => {
    if (reviewData) {
      form.reset(reviewData);
      setIsPreview(true);
    }
  }, [reviewData, form.reset]);

  const createReview = useMutation({
    mutationFn: async (data: any) => {
      const res = await axiosInstance.post("/product/api/create-review", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setIsPreview(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateReview = useMutation({
    mutationFn: async (data: any) => {
      const res = await axiosInstance.put("/product/api/update-review", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      setIsPreview(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    if (reviewData) {
      updateReview.mutate({
        id: reviewData.id,
        productId,
        rating: data.rating,
        comment: data.comment,
        title: data.title,
      });
    } else {
      createReview.mutate({
        productId,
        rating: data.rating,
        comment: data.comment,
        title: data.title,
      });
    }
  }

  return (
    <Form {...form}>
      <form className="flex flex-col gap-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <p className="font-medium">{isPreview ? "Your rating" : "Like it? Give it a rating."}</p>
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <StarPicker value={field.value} onChange={field.onChange} disabled={isPreview} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <InputShadcn {...field} disabled={isPreview} />
              </FormControl>
              <FormDescription>Enter review title</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="Want to leave a written review?" disabled={isPreview} {...field} className="h-40" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!isPreview && (
          <Button
            variant="outline"
            disabled={createReview.isPending || updateReview.isPending}
            type="submit"
            size="lg"
            className="bg-black text-white hover:bg-pink-400 hover:text-primary w-fit cursor-pointer px-2"
          >
            {reviewData ? "Update review" : "Post review"}
          </Button>
        )}
      </form>
      {isPreview && (
        <Button
          onClick={() => setIsPreview(false)}
          disabled={createReview.isPending || updateReview.isPending}
          size="lg"
          type="button"
          variant="outline"
          className="w-fit cursor-pointer mt-4 px-4"
        >
          Edit
        </Button>
      )}
    </Form>
  );
}
