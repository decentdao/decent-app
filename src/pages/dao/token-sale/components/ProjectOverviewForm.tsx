import { Grid, Icon, Input, InputGroup, InputLeftElement, VStack } from '@chakra-ui/react';
import { DiscordLogo, GithubLogo, Globe, TelegramLogo, XLogo } from '@phosphor-icons/react';
import { InputComponent, LabelComponent, TextareaComponent } from '../../../../components/ui/forms/InputComponent';
import { SectionHeader } from '../../../../components/ui/forms/SectionHeader';
import { TokenSaleFormValues } from '../types';

interface ProjectOverviewFormProps {
  values: TokenSaleFormValues;
  setFieldValue: (field: string, value: any) => void;
}

export function ProjectOverviewForm({ values, setFieldValue }: ProjectOverviewFormProps) {
  return (
    <VStack spacing={8} align="stretch">
      {/* Project Overview Section */}
      <SectionHeader
        title="Project Overview"
        description="Let's start with the basics. Make it easy for people to learn about your project."
      />
      
      <VStack spacing={6} align="stretch">
        <InputComponent
          label="What is your project's name?"
          isRequired={true}
          value={values.projectName}
          onChange={(e) => setFieldValue('projectName', e.target.value)}
          testId="project-name"
          placeholder="e.g. SuperDAO"
        />
        
        <TextareaComponent
          label="Tell me about your project"
          isRequired={true}
          value={values.projectDescription}
          onChange={(e) => setFieldValue('projectDescription', e.target.value)}
          placeholder="Describe what your project does, the problem it solves, and why it matters. Think of this as your elevator pitch to potential investors."
          rows={4}
        />
        
        <LabelComponent
          label="Provide your website URL"
          isRequired={true}
        >
          <InputGroup>
            <InputLeftElement>
              <Icon as={Globe} color="color-neutral-400" />
            </InputLeftElement>
            <Input
              value={values.websiteUrl}
              onChange={(e) => setFieldValue('websiteUrl', e.target.value)}
              placeholder="https://yourproject.xyz"
              pl="2.5rem"
            />
          </InputGroup>
        </LabelComponent>
      </VStack>

      {/* Build Credibility Section */}
      <SectionHeader
        title="Build Credibility"
        description="These help investors verify your legitimacy and learn more about your project. While optional, they significantly boost trust."
      />
      
      <Grid templateColumns="1fr 1fr" gap={6}>
        <LabelComponent
          label="X Handle"
          isRequired={false}
        >
          <InputGroup>
            <InputLeftElement>
              <Icon as={XLogo} color="color-neutral-400" />
            </InputLeftElement>
            <Input
              value={values.xHandle}
              onChange={(e) => setFieldValue('xHandle', e.target.value)}
              placeholder="@superdao"
              pl="2.5rem"
            />
          </InputGroup>
        </LabelComponent>
        
        <LabelComponent
          label="Github Link"
          isRequired={false}
        >
          <InputGroup>
            <InputLeftElement>
              <Icon as={GithubLogo} color="color-neutral-400" />
            </InputLeftElement>
            <Input
              value={values.githubLink}
              onChange={(e) => setFieldValue('githubLink', e.target.value)}
              placeholder="https://github.com/yourproject"
              pl="2.5rem"
            />
          </InputGroup>
        </LabelComponent>
        
        <LabelComponent
          label="Telegram Group"
          isRequired={false}
        >
          <InputGroup>
            <InputLeftElement>
              <Icon as={TelegramLogo} color="color-neutral-400" />
            </InputLeftElement>
            <Input
              value={values.telegramGroup}
              onChange={(e) => setFieldValue('telegramGroup', e.target.value)}
              placeholder="https://t.me/yourgroup"
              pl="2.5rem"
            />
          </InputGroup>
        </LabelComponent>
        
        <LabelComponent
          label="Discord Server"
          isRequired={false}
        >
          <InputGroup>
            <InputLeftElement>
              <Icon as={DiscordLogo} color="color-neutral-400" />
            </InputLeftElement>
            <Input
              value={values.discordServer}
              onChange={(e) => setFieldValue('discordServer', e.target.value)}
              placeholder="https://discord.gg/yourserver"
              pl="2.5rem"
            />
          </InputGroup>
        </LabelComponent>
      </Grid>
    </VStack>
  );
}
