export D=$PWD \
&& cd ../ts \
&& bash scripts/reinit.sh \
&& mkdir -p $D/# \
&& rm -rf $D/#/.git \
&& rsync -r .git $D/#/ \
&& cd $D/# \
&& git reset --hard \
&& git clean -fd \
&& make -Bs install;
