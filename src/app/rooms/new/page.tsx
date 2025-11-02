'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadingSwap } from '@/components/ui/loading-swap';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { Controller, useForm } from 'react-hook-form';
import z from 'zod';

const formSchema = z.object({
  name: z.string().min(1).trim(),
  isPublic: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

export default function NewRoomPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      isPublic: false,
    },
  });

  async function handleSubmit(data: FormData) {
    await new Promise((res) => setTimeout(res, 1000));
    console.log(data);
  }

  return (
    <div className="container mx-auto px-4 py-8 ">
      <Card className="w-full max-w-l mx-auto">
        <CardHeader>
          <CardTitle>New Room</CardTitle>
          <CardDescription>Create a new chat room</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Room Name</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    {fieldState.error && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="isPublic"
                control={form.control}
                render={({ field: { value, onChange, ...field }, fieldState }) => (
                  <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                    <Checkbox
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      checked={value}
                      onCheckedChange={onChange}
                    />
                    <FieldContent>
                      <FieldLabel className="font-normal" htmlFor={field.name}>
                        Public Room
                      </FieldLabel>
                      {fieldState.error && <FieldError errors={[fieldState.error]} />}
                    </FieldContent>
                  </Field>
                )}
              />

              <Field orientation="horizontal" className="w-full">
                <Button type="submit" className="flex-grow" disabled={form.formState.isSubmitting}>
                  <LoadingSwap isLoading={form.formState.isSubmitting}>Create Room</LoadingSwap>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/">Cancel</Link>
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
