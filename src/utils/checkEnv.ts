type EnvVarName = keyof NodeJS.ProcessEnv;

type CheckEnvOptions = {
  throws?: boolean;
};

export default function checkEnv(
  varname: EnvVarName,
  options: CheckEnvOptions = {}
) {
  const { throws = true } = options;
  const isEnvSet = process.env[varname] !== undefined;

  if (throws && !isEnvSet) {
    throw new Error(`Environment variable '${varname}' has not been set.`);
  }

  return isEnvSet;
}
