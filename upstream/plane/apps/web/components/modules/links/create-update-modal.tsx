/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
// plane types
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { InputField } from "@makeplane/propel/components/input-field";
import { setToast } from "@plane/blocks/toast";
import type { ILinkDetails, ModuleLink } from "@plane/types";

type Props = {
  createLink: (formData: ModuleLink) => Promise<void>;
  data?: ILinkDetails | null;
  isOpen: boolean;
  handleClose: () => void;
  updateLink: (formData: ModuleLink, linkId: string) => Promise<void>;
};

const defaultValues: ModuleLink = {
  title: "",
  url: "",
};

export function CreateUpdateModuleLinkModal(props: Props) {
  const { isOpen, handleClose, createLink, updateLink, data } = props;
  // form info
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
    reset,
  } = useForm<ModuleLink>({
    defaultValues,
  });

  const onClose = () => {
    handleClose();
  };

  const handleFormSubmit = async (formData: ModuleLink) => {
    const parsedUrl = formData.url.startsWith("http") ? formData.url : `http://${formData.url}`;
    const payload = {
      title: formData.title,
      url: parsedUrl,
    };

    try {
      if (!data) {
        await createLink(payload);
        setToast({
          type: "success",
          title: "成功！",
          message: "模块链接已创建。",
        });
      } else {
        await updateLink(payload, data.id);
        setToast({
          type: "success",
          title: "成功！",
          message: "模块链接已更新。",
        });
      }
      onClose();
    } catch (error: any) {
      setToast({
        type: "error",
        title: "错误！",
        message: error?.data?.error ?? "发生错误。请重试。",
      });
    }
  };

  useEffect(() => {
    reset({
      ...defaultValues,
      ...data,
    });
  }, [data, isOpen, reset]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent size="md">
        <form onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)} className="flex min-h-0 flex-1 flex-col">
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>{data ? "更新" : "添加"} 链接</DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody tabIndex={0}>
              <div className="flex flex-col gap-4">
                <Controller
                  control={control}
                  name="url"
                  rules={{
                    required: "URL is required",
                  }}
                  render={({ field: { value, onChange, ref } }) => (
                    <InputField
                      id="url"
                      type="text"
                      size="lg"
                      orientation="vertical"
                      label="网址"
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      error={errors.url?.message}
                      placeholder="输入或粘贴链接"
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { value, onChange, ref } }) => (
                    <InputField
                      id="title"
                      type="text"
                      size="lg"
                      orientation="vertical"
                      label="显示标题"
                      description="可选"
                      value={value}
                      onChange={onChange}
                      ref={ref}
                      error={errors.title?.message}
                      placeholder="您希望如何显示此链接"
                    />
                  )}
                />
              </div>
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <Button variant="secondary" size="md" stretch="auto" onClick={onClose} label="取消" />
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              type="submit"
              loading={isSubmitting}
              label={
                data ? (isSubmitting ? "正在更新链接" : "更新链接") : isSubmitting ? "正在添加链接" : "添加链接"
              }
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
