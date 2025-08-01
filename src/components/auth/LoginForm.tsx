"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Image from "next/image"

// Shadcn/ui components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"

// Custom components
import { Container, VStack, HStack, Flex } from "@/components/ui/layout"
import { Heading, Text, Link } from "@/components/ui/typography"
import { Spinner } from "@/components/ui/feedback"

// Utils and hooks
import { socialLogin } from "@/utils/data/auth"
import { signInWithEmail } from "@/app/(auth)/actions"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { createClient } from "@/utils/supabase/client"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const { isAuthenticated, refreshAuthState } = useSupabaseAuth()
  const [error, setError] = useState<string | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const isKakao = typeof navigator !== "undefined" && Boolean(navigator.userAgent.match("KAKAOTALK"))

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  const handleGoogleLogin = async () => {
    if (isKakao) {
      toast.error("카카오톡 브라우저에서는 구글 로그인을 지원하지 않습니다.")
      return
    }
    
    setIsGoogleLoading(true)
    setError(null)
    
    try {
      const { error } = await socialLogin("google")
      if (error) {
        setError("Google 로그인에 실패했습니다.")
        toast.error("Google 로그인에 실패했습니다.")
      }
    } catch (err) {
      const errorMessage = "Google 로그인 중 오류가 발생했습니다."
      setError(errorMessage)
      toast.error(errorMessage)
      console.error("Google login error:", err)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    
    try {
      const { userData, error } = await signInWithEmail(data.email, data.password)
      
      if (error) {
        setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.")
        return
      }

      const supabase = createClient()
      const { data: user } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", userData.user?.email || "")
        .single()

      if (!user) {
        router.push("/login/info")
        return
      }

      refreshAuthState()
      router.push("/")
      toast.success("로그인되었습니다!")
    } catch (err) {
      const errorMessage = "로그인 중 오류가 발생했습니다."
      setError(errorMessage)
      toast.error(errorMessage)
      console.error("Login error:", err)
    }
  }

  return (
    <Container maxW="md" className="min-h-screen flex items-center justify-center py-12">
      <VStack spacing={4} className="w-full max-w-md">
        <Card className="w-full">
          <CardHeader className="space-y-1 text-center">
            <Heading as="h2" size="2xl">
              로그인
            </Heading>
          </CardHeader>
          <CardContent>
            <VStack spacing={4}>
              {/* Google Login Button */}
              <Button
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
                variant="outline"
                className="w-full h-11 bg-black hover:bg-gray-800 text-white border-black"
              >
                {isGoogleLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <HStack spacing={2} className="items-center">
                    <Image src="/google.svg" alt="Google" width={20} height={20} />
                    <Text className="font-semibold">Google로 시작하기</Text>
                  </HStack>
                )}
              </Button>

              {/* Divider */}
              <HStack className="w-full items-center">
                <Separator className="flex-1" />
                <Text size="sm" variant="muted" className="px-2">
                  또는
                </Text>
                <Separator className="flex-1" />
              </HStack>

              {/* Login Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            autoComplete="username"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>비밀번호</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="비밀번호"
                            autoComplete="current-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <div className="text-right">
                          <Link
                            variant="muted"
                            size="sm"
                            onClick={() => router.push("/forgot-password")}
                            className="cursor-pointer hover:text-primary"
                          >
                            비밀번호를 잊으셨나요?
                          </Link>
                        </div>
                      </FormItem>
                    )}
                  />

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting || !form.watch("email") || !form.watch("password")}
                    className="w-full font-semibold"
                  >
                    {form.formState.isSubmitting ? (
                      <HStack spacing={2}>
                        <Spinner size="sm" />
                        <span>로그인 중...</span>
                      </HStack>
                    ) : (
                      "로그인"
                    )}
                  </Button>
                </form>
              </Form>
            </VStack>
          </CardContent>
        </Card>

        {/* Signup Link */}
        <Text size="sm" variant="muted" className="text-center">
          계정이 없으신가요?{" "}
          <Link
            onClick={() => router.push("/signup")}
            className="font-semibold cursor-pointer"
          >
            회원가입
          </Link>
        </Text>
      </VStack>
    </Container>
  )
}

export default LoginForm